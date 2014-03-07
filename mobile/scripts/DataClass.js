

/**
 * Data class, for personal client data.
 * 
 * @version 0.0.1
 *
 * @class Function for personal data.
 * 
 * @author <a href="mailto:greshnik-sv@ya.ru">Ratkin Sergey</a>
 *
 * @example
 * DC.GetPriceForCustomer('123213','4564560')
 * 
 * @constructor
 */
var DC=
{
    /**
     * @description Get price for customer, including global and personal discount.
     * 
     * @function
     * 
     * @param {int} productId
     * @param {int} customer
     * @returns {double} Price
     */
    GetPriceForCustomer:function (productId, customer)
    {
        var storeId = $('#cbx_store_list option:selected').val();
        var cust = customer;//fic.getValue(CrossDataFunction,"returnCustomer");
        var pGroupId1=0;
        var pGroupId2=0;
        var pGroupId3=0;
        var customerDiscountGroupId=0;
        var priceNum=1;
        var custDiscount=0;
        var price1=0;
        var price2=0;
        var price3=0;
        var price4=0;
        var price5=0;
        var priceForCustomer=0;
        
        prodl = typeof prodl !== 'undefined' ? prodl : null;
        
        if(prodl==null)
        STOR.Get("products_rest", "", function(json)
        { 
            prodl = regFn.parseJSON(json);
        });   

        for(var i=0;i<prodl.rest_products.items.length;i++)
        {
            var id=prodl.rest_products.items[i]._id;
            var store =prodl.rest_products.items[i]._store; 

            if(productId==id && store==storeId)
            {
                pGroupId1 =prodl.rest_products.items[i]._pGroupId1;
                pGroupId2 =prodl.rest_products.items[i]._pGroupId2;
                pGroupId3 =prodl.rest_products.items[i]._pGroupId3;

                price1 =prodl.rest_products.items[i]._price1;
                price2 =prodl.rest_products.items[i]._price2;
                price3 =prodl.rest_products.items[i]._price3;
                price4 =prodl.rest_products.items[i]._price4;
                price5 =prodl.rest_products.items[i]._price5;
            }
        }

        var custl;
        STOR.Get("customers", "", function(json)
        { 
            custl = regFn.parseJSON(json);
        });

        for(var i=0;i<custl.customers.items.length;i++)
        {
            var name=custl.customers.items[i]._name;
            var id=custl.customers.items[i]._id;
            var disgid=custl.customers.items[i]._disgid;
            if(id==cust)
            {
                customerDiscountGroupId = disgid;
            }
        }

        var discount;
        STOR.Get("discounts", "", function(json)
        { 
            discount = regFn.parseJSON(json);
        });

        for(var i=0;i<discount.discounts.items.length;i++)
        {
            if(discount.discounts.items[i]._disg==customerDiscountGroupId)
            {
                if(discount.discounts.items[i]._dispg==pGroupId3)
                {
                    priceNum=discount.discounts.items[i]._pricenum;
                    custDiscount=discount.discounts.items[i]._dis;
                }
                else if(discount.discounts.items[i]._dispg==pGroupId2)
                {
                    priceNum=discount.discounts.items[i]._pricenum;
                    custDiscount=discount.discounts.items[i]._dis;
                }
                else if(discount.discounts.items[i]._dispg==pGroupId1)
                {
                    priceNum=discount.discounts.items[i]._pricenum;
                    custDiscount=discount.discounts.items[i]._dis;
                }
                else
                {
                    alert("FUCK :(");
                }
            }
        }

        if(priceNum==1)
        {
            priceForCustomer=price1*(1-custDiscount/100);
        }
        else if(priceNum==2)
        {
            priceForCustomer=price2*(1-custDiscount/100);
        }
        else if(priceNum==3)
        {
            priceForCustomer=price3*(1-custDiscount/100);
        }
        else
        {
            alert("FUCKing shit :(");
        }

        return parseFloat(priceForCustomer).toFixed(2);// priceForCustomer;
    },
          
    /**
     * @description Getting product name for productId
     * @function
     * @param {int} productId
     * @returns {string|null}
     */        
    GetProductName:function (productId)
    {
        prodl = typeof prodl !== 'undefined' ? prodl : null;
        
        if(prodl==null)
        STOR.Get("products_rest", "", function(json)
        { 
            prodl = regFn.parseJSON(json);
        });   
        
        for(var i=0;i<prodl.rest_products.items.length;i++)
        {
            var id=prodl.rest_products.items[i]._id;
            var store =prodl.rest_products.items[i]._store; 

            if(productId==id)
            {
               return prodl.rest_products.items[i]._name; 
            }
        }
        return null;
    },
            
    /**
     * @description Getting customer name form customer id.
     * @function
     * @param {int} customerId
     * @returns {string|null}
     */
    GetCustomerName:function (customerId)
    {
        var custl;
        STOR.Get("customers", "", function(json)
        { 
            custl = regFn.parseJSON(json);
        });
    
        for(var i=0;i<custl.customers.items.length;i++)
        {
            var namec=custl.customers.items[i]._name;
            var idc=custl.customers.items[i]._id;
            if(idc==customerId)
            {
                return namec;
            }
        }
        return null;
    },
    /**
     * @description Getting shop name form shopId.
     * @function
     * @param {int} shopId
     * @returns {string|null}
     */
    GetShopName:function (shopId)
    {
        var shopl;
        STOR.Get("shops", "", function(json)
        { 
            shopl = regFn.parseJSON(json);
        });

        for(var i=0;i<shopl.shops.items.length;i++)
        {
            var name=shopl.shops.items[i]._name;
            var id=shopl.shops.items[i]._id;
            var cust=shopl.shops.items[i]._cust;
            if(id==shopId)
            {
                return name;
            }
        }
        return null;
    },
    /**
     * @description Getting customerId from ShopId.
     * @function
     * @param {int} shopId
     * @returns {int|null}
     */
    GetCustomerFormShop:function (shopId)
    {
        var shopl;
        STOR.Get("shops", "", function(json)
        { 
            shopl = regFn.parseJSON(json);
        });

        for(var i=0;i<shopl.shops.items.length;i++)
        {
            var name=shopl.shops.items[i]._name;
            var id=shopl.shops.items[i]._id;
            var cust=shopl.shops.items[i]._cust;
            if(id==shopId)
            {
                return cust;
            }
        }
        return null;
    },
    
    /**
     * @description Getting store name from storeId.
     * @function
     * @param {type} storeId
     * @returns {unresolved}
     */
    GetStoreName:function (storeId)
    {
        STOR.Get("stores", "", function(json)
        { 
            stores = JSON.parse(json);
        });

        for(var i=0;i<stores.stores.items.length;i++)
        {
            if(stores.stores.items[i]._id==storeId)
            {
                return stores.stores.items[i]._name;
            }
        }
        return null;
    }
    
}








